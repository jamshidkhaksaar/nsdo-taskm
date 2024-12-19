from typing import TYPE_CHECKING, TypeVar, Optional, Union, Any, Generic
from django.db.models import Model

if TYPE_CHECKING:
    from django.db.models.fields.related import ForeignKey
    from django.contrib.auth.models import User
    from .models import Board, List

T = TypeVar('T', bound=Model)

class SafeForeignKey:
    def __init__(self, related_model):
        self.related_model = related_model

    def __call__(self, *args, **kwargs):
        return self

    def all(self):
        return []

    def get(self, **kwargs):
        return None

def _safe_foreign_key_access(obj, attr):
    if hasattr(obj, attr):
        value = getattr(obj, attr)
        if isinstance(value, SafeForeignKey):
            return value.related_model()
        return value
    return None

class SafeModelWrapper(Generic[T]):
    """
    A wrapper to provide type-safe access to Django model instances
    """
    def __init__(self, model_instance: Optional[T] = None):
        self._instance: Optional[T] = model_instance

    def __getattr__(self, name: str) -> Any:
        """
        Safely access attributes of the wrapped model instance
        """
        if self._instance is None:
            raise AttributeError(f"Cannot access attribute {name} on None model instance")
        
        try:
            return getattr(self._instance, name)
        except AttributeError:
            raise AttributeError(f"Attribute {name} not found on {type(self._instance).__name__}")

    def get_instance(self) -> Optional[T]:
        """
        Return the underlying model instance
        """
        return self._instance

def safe_model_access(model_instance: Optional[T]) -> SafeModelWrapper[T]:
    """
    Create a safe wrapper around a model instance
    """
    return SafeModelWrapper(model_instance)

def safe_queryset_get(queryset, **kwargs) -> SafeModelWrapper[Model]:
    """
    Safely get a single object from a queryset
    """
    try:
        return safe_model_access(queryset.get(**kwargs))
    except Exception as e:
        raise ValueError(f"Error retrieving object: {str(e)}")
