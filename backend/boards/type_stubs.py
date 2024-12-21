from typing import TypeVar, Generic, Any, Type, List as PyList
from django.db.models import Model, Manager, QuerySet

ModelType = TypeVar('ModelType', bound=Model)

class TypeSafeManagerDescriptor(Generic[ModelType]):
    def __init__(self, model_class: Type[ModelType]):
        self._model_class = model_class
        self._manager: Any = None

    def __get__(self, instance: Any, owner: Any = None) -> 'TypeSafeManagerDescriptor[ModelType]':
        # Lazily access the objects manager
        if self._manager is None:
            # Use getattr to bypass type checking
            self._manager = getattr(self._model_class, 'objects')
        return self._manager

    def all(self) -> QuerySet[ModelType]:
        # Use getattr to bypass type checking
        return getattr(self._model_class, 'objects').all()

    def filter(self, *args: Any, **kwargs: Any) -> QuerySet[ModelType]:
        # Use getattr to bypass type checking
        return getattr(self._model_class, 'objects').filter(*args, **kwargs)

    def get(self, *args: Any, **kwargs: Any) -> ModelType:
        # Use getattr to bypass type checking
        return getattr(self._model_class, 'objects').get(*args, **kwargs)

    def create(self, **kwargs: Any) -> ModelType:
        # Use getattr to bypass type checking
        return getattr(self._model_class, 'objects').create(**kwargs)

def get_type_safe_manager(model_class: Type[ModelType]) -> TypeSafeManagerDescriptor[ModelType]:
    return TypeSafeManagerDescriptor(model_class)
